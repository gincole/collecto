"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeedback } from "@/components/shared/feedback";
import {
  errorMessage,
  type Field,
  type FieldManagerActions,
} from "./field-manager-contract";

function sameOrder(left: Field[], right: Field[]) {
  return (
    left.length === right.length &&
    left.every((field, index) => field.id === right[index]?.id)
  );
}

/** One write at a time; intermediate gestures coalesce into the latest intent. */
export function useFieldOrder(
  serverFields: Field[],
  collectionId: string,
  actions: FieldManagerActions,
  dragging: boolean,
) {
  const [ordering, setOrdering] = useState({
    source: serverFields,
    fields: serverFields,
    deferred: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const confirmed = useRef(serverFields);
  const queued = useRef<Field[] | null>(null);
  const running = useRef(false);
  const mounted = useRef(true);
  const router = useRouter();
  const notify = useFeedback();
  if (
    ordering.source !== serverFields ||
    (ordering.deferred && !saving && !dragging)
  ) {
    setOrdering({
      source: serverFields,
      fields: saving || dragging ? ordering.fields : serverFields,
      deferred: dragging && !saving,
    });
  }
  const fields = ordering.fields;
  function setFields(next: Field[]) {
    setOrdering((current) => ({ ...current, fields: next, deferred: false }));
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!saving && !dragging) confirmed.current = fields;
  }, [fields, saving, dragging]);

  async function drain() {
    running.current = true;
    setSaving(true);
    while (queued.current) {
      const next = queued.current;
      queued.current = null;
      if (sameOrder(next, confirmed.current)) continue;
      let result;
      try {
        result = await actions.reorderFields({
          collectionId,
          fieldIds: next.map((field) => field.id),
        });
      } catch {
        result = { status: "error" as const };
      }
      if (result.status === "success") confirmed.current = next;
      else if (!queued.current && mounted.current) {
        const error = errorMessage(result, "Field order");
        setFields(confirmed.current);
        setMessage(error);
        notify(error, "error");
      }
    }
    running.current = false;
    if (mounted.current) {
      setSaving(false);
      router.refresh();
    }
  }

  function saveOrder(next: Field[]) {
    setMessage(undefined);
    setFields(next);
    queued.current = next;
    if (!running.current) void drain();
  }
  return { fields, saving, message, saveOrder };
}

import { useId, useState } from "react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { validateEntryName } from "./fileTreeEntryActions";

export interface EntryNameRequest {
  readonly title: string;
  readonly description: string;
  readonly initialValue: string;
  readonly submitLabel: string;
  /** Resolves to an error message to show, or null once the change is made. */
  readonly onSubmit: (name: string) => Promise<string | null>;
}

/** Name prompt for the explorer's new file, new folder, and rename actions. */
export function EntryNameDialog(props: { request: EntryNameRequest; onClose: () => void }) {
  const id = useId();
  const { request } = props;
  const [value, setValue] = useState(request.initialValue);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const validation = validateEntryName(value);
    if (validation !== null) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    const failure = await request.onSubmit(value.trim());
    setSubmitting(false);
    if (failure === null) props.onClose();
    else setError(failure);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogPopup className="sm:max-w-sm">
        <form
          className="flex min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (!submitting) void submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{request.title}</DialogTitle>
            <DialogDescription>{request.description}</DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <div className="flex flex-col gap-1.5">
              <Input
                id={`${id}-name`}
                aria-label="Name"
                aria-invalid={error !== null}
                autoFocus
                spellCheck={false}
                value={value}
                onFocus={(event) => {
                  // Like other editors, select the name without its extension.
                  const input = event.currentTarget;
                  const dot = input.value.lastIndexOf(".");
                  input.setSelectionRange(0, dot > 0 ? dot : input.value.length);
                }}
                onChange={(event) => {
                  setValue(event.target.value);
                  setError(null);
                }}
              />
              {error ? <p className="text-xs text-destructive-foreground">{error}</p> : null}
            </div>
          </DialogPanel>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={props.onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {request.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

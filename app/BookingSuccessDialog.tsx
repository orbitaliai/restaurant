"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";

type BookingSuccessDialogProps = {
  date: string;
  partySize: number;
  time: string;
};

export function BookingSuccessDialog({
  date,
  partySize,
  time,
}: BookingSuccessDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en", {
        dateStyle: "full",
      }).format(new Date(`${date}T12:00:00`)),
    [date],
  );

  function closeDialog() {
    setOpen(false);
    router.replace(`/?date=${date}&people=${partySize}`, { scroll: false });
  }

  return (
    <Modal show={open} size="md" popup onClose={closeDialog} dismissible>
      <ModalHeader />
      <ModalBody>
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-100 text-2xl font-semibold text-green-700 dark:bg-green-900 dark:text-green-200">
            OK
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Table booked
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Your reservation is confirmed for {formattedDate} at {time} for{" "}
              {partySize} {partySize === 1 ? "guest" : "guests"}.
            </p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="justify-center">
        <Button onClick={closeDialog}>Done</Button>
      </ModalFooter>
    </Modal>
  );
}

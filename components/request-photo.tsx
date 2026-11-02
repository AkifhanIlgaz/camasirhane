"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Modal, useOverlayState } from "@heroui/react";

import { useI18n } from "@/lib/i18n";
import { db } from "@/lib/firebase";
import type { RequestImage } from "@/types";

/** İstek fotoğrafı küçük resim olarak görünür, dokununca büyür. 10 gün sonra silinir. */
export function RequestPhoto({ requestId }: { requestId: string }) {
  const [image, setImage] = useState<string | null | undefined>(undefined);
  const modal = useOverlayState();
  const { t } = useI18n();

  useEffect(() => {
    let active = true;

    getDoc(doc(db, "requestImages", requestId))
      .then((snap) => {
        const data = snap.data() as RequestImage | undefined;
        const expired = data && data.expireAt.toDate().getTime() < Date.now();
        if (active) setImage(data && !expired ? data.image : null);
      })
      .catch(() => active && setImage(null));

    return () => {
      active = false;
    };
  }, [requestId]);

  if (image === undefined) return null;
  if (image === null) return <p className="text-xs text-muted">{t("photo.deleted")}</p>;

  return (
    <>
      <button className="w-fit" type="button" onClick={modal.open}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={t("photo.alt")} className="h-20 w-20 rounded-xl object-cover" src={image} />
      </button>
      <Modal.Backdrop isOpen={modal.isOpen} onOpenChange={modal.setOpen}>
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Body className="p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={t("photo.alt")} className="w-full rounded-xl" src={image} />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}

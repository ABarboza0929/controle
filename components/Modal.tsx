/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { ReactNode, MouseEvent } from 'react';

type ModalProps = {
  children?: ReactNode;
  onClose: () => void;
};

export default function Modal({ children, onClose }: ModalProps) {
  const handleShroudClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modalShroud" onClick={handleShroudClick}>
      <div className="modal">{children}</div>
    </div>
  );
}

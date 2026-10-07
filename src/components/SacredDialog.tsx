import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface SacredDialogProps {
    children: ReactNode;
    onClose: () => void;
    labelledBy: string;
    className?: string;
}

export default function SacredDialog({ children, onClose, labelledBy, className = '' }: SacredDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const pointerStartedOnBackdrop = useRef(false);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (!dialog.open) dialog.showModal();
        return () => {
            dialog.close();
            if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
        };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            className={`sacred-dialog ${className}`}
            aria-labelledby={labelledBy}
            onCancel={(event) => { event.preventDefault(); onClose(); }}
            onPointerDown={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                pointerStartedOnBackdrop.current = event.clientX < bounds.left || event.clientX > bounds.right
                    || event.clientY < bounds.top || event.clientY > bounds.bottom;
            }}
            onClick={(event) => {
                if (event.target === event.currentTarget && pointerStartedOnBackdrop.current) onClose();
                pointerStartedOnBackdrop.current = false;
            }}
        >
            {children}
        </dialog>
    );
}

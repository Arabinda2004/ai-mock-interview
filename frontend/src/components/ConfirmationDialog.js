import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

const intentStyles = {
    danger: {
        icon: 'text-rose-600',
        confirmButton: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500/40',
    },
    primary: {
        icon: 'text-blue-600',
        confirmButton: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500/40',
    },
};

const ConfirmationDialog = ({
    open,
    title,
    message,
    confirmText,
    cancelText,
    intent = 'danger',
    onConfirm,
    onCancel,
}) => {
    const titleId = useId();
    const descriptionId = useId();
    const style = intentStyles[intent] || intentStyles.primary;

    useEffect(() => {
        if (!open) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onCancel();
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onCancel]);

    if (!open) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6">
            <button
                type="button"
                className="absolute inset-0 h-full w-full cursor-default bg-slate-900/55 backdrop-blur-[2px]"
                onClick={onCancel}
                aria-label="Close confirmation dialog"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
                <div className="flex items-start gap-3">
                    <span className={`mt-0.5 rounded-xl bg-slate-100 p-2.5 ${style.icon}`}>
                        <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 id={titleId} className="text-xl font-semibold text-slate-900">
                            {title}
                        </h2>
                        <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-600">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 ${style.confirmButton}`}
                        autoFocus
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ConfirmationDialog;
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmationDialog from '../components/ConfirmationDialog';

const ConfirmationDialogContext = createContext(null);

const defaultDialogOptions = {
    title: 'Please confirm',
    message: 'Are you sure you want to continue?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    intent: 'danger',
};

export const ConfirmationDialogProvider = ({ children }) => {
    const resolverRef = useRef(null);
    const [dialogOptions, setDialogOptions] = useState({
        ...defaultDialogOptions,
        open: false,
    });

    const resolveDialog = useCallback((confirmed) => {
        if (resolverRef.current) {
            resolverRef.current(confirmed);
            resolverRef.current = null;
        }

        setDialogOptions((previous) => ({
            ...previous,
            open: false,
        }));
    }, []);

    const confirm = useCallback((options = {}) => {
        if (resolverRef.current) {
            resolverRef.current(false);
            resolverRef.current = null;
        }

        setDialogOptions({
            ...defaultDialogOptions,
            ...options,
            open: true,
        });

        return new Promise((resolve) => {
            resolverRef.current = resolve;
        });
    }, []);

    useEffect(() => {
        return () => {
            if (resolverRef.current) {
                resolverRef.current(false);
                resolverRef.current = null;
            }
        };
    }, []);

    const contextValue = useMemo(
        () => ({
            confirm,
        }),
        [confirm],
    );

    return (
        <ConfirmationDialogContext.Provider value={contextValue}>
            {children}
            <ConfirmationDialog
                open={dialogOptions.open}
                title={dialogOptions.title}
                message={dialogOptions.message}
                confirmText={dialogOptions.confirmText}
                cancelText={dialogOptions.cancelText}
                intent={dialogOptions.intent}
                onConfirm={() => resolveDialog(true)}
                onCancel={() => resolveDialog(false)}
            />
        </ConfirmationDialogContext.Provider>
    );
};

export const useConfirmationDialog = () => {
    const context = useContext(ConfirmationDialogContext);

    if (!context) {
        throw new Error('useConfirmationDialog must be used within ConfirmationDialogProvider');
    }

    return context;
};
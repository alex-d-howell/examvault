import React, { useRef, useState, useEffect } from 'react';
import { Dialog } from '@vaadin/react-components/Dialog';

export const ReadMoreModal = ({ description }: { description: string }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [dialogOpened, setDialogOpened] = useState(false);

    useEffect(() => {
        const el = contentRef.current;
        if (el && el.scrollHeight > el.clientHeight) {
            setIsOverflowing(true);
        }
    }, [description]);

    return (
        <div style={{ height: '5rem' }}>
            <p
                ref={contentRef}
                style={{
                    height: '3rem',
                    overflow: 'hidden',
                    fontSize: 'var(--lumo-font-size-xs)'
                }}
            >
                {description}
            </p>{isOverflowing && (
                <a style={{
                    height: '1rem',
                    fontSize: 'var(--lumo-font-size-xs)',
                    cursor: 'pointer',
                }} onClick={() => setDialogOpened(true)}>
                    …read more
                </a>
            )}

            <Dialog
                opened={dialogOpened}
                onOpenedChanged={(e) => setDialogOpened(e.detail.value)}
                headerTitle="Full Description"
            >
                <p style={{ fontSize: 'var(--lumo-font-size-s)', margin: 0 }}>{description}</p>
            </Dialog>
        </div>
    );
};

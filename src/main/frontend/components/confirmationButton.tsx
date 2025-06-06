import { Button, Dialog } from "@vaadin/react-components";
import { useRef, useState } from "react";

export const ConfirmationButton = ({ action, modalTitle, modalDescription, buttonText, buttonClassName, buttonTheme, onYes }: {action: string, modalTitle: string, modalDescription: string, buttonText: string, buttonClassName: string, buttonTheme: string, onYes: Function }) => {

    const [dialogOpened, setDialogOpened] = useState(false);

    return (<>
        <Button onClick={() => setDialogOpened(true)} className={buttonClassName} theme={buttonTheme}>
            {buttonText}
        </Button>
        <Dialog
            opened={dialogOpened}
            onOpenedChanged={(e) => setDialogOpened(e.detail.value)}
            headerTitle={modalTitle}
            footer={
                <div className="flex flex-row">
                    <Button
                        onClick={() => setDialogOpened(false)}
                        className="m-s"
                        theme="tertiary"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            setDialogOpened(false);
                            onYes();
                        }}
                        className="m-s"
                        theme="primary"
                    >
                        {action}
                    </Button>

                </div>
            }
        >
            <p style={{ fontSize: 'var(--lumo-font-size-s)', margin: 0 }}>{modalDescription}</p>
        </Dialog>
    </>
    );
}


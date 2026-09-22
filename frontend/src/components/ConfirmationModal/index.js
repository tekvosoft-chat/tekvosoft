import React from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";

import { i18n } from "../../translate/i18n";
import { FormControlLabel, Switch } from "@material-ui/core";

/** ConfirmationModal
 * @param {string} title - Title of the modal
 * @param {string} children - Content of the modal
 * @param {boolean} open - If the modal is open
 * @param {function} onClose - Function to be called when the modal is closed
 * @param {function} onConfirm - Function to be called when the OK button is clicked
 * @param {boolean} rawChildren - If the children is a raw HTML or React Components
 * @param {boolean} okEnabled - If the OK button is enabled
 * @param {string} checkbox - Label of an optional switch (value goes as 1st arg of onConfirm)
 * @param {Array} checkboxes - More switches: [{ name, label, hint }] (values go as 2nd arg of onConfirm, by name)
 * @returns {React.Component}
 * @constructor
 * @example
 * <Confirmation
 *  title="Title"
 *  children="Content"
 *  open={true}
 *  onClose={() => {}}
 *  onConfirm={() => {}}
 *  rawChildren={false}
 *  okEnabled={true}
 * />
 * */

const ConfirmationModal = ({
  title,
  children,
  open,
  onClose,
  onConfirm,
  okEnabled = true,
  checkbox,
  checkboxes = []
}) => {
  const [checked, setChecked] = React.useState(false);
  const [extra, setExtra] = React.useState({});

  // cada abertura começa desmarcada (a opção pode ser destrutiva)
  React.useEffect(() => {
    if (open) {
      setChecked(false);
      setExtra({});
    }
  }, [open]);

  const switchLabel = (label, hint) => (
    <span style={{ display: "block", paddingTop: 9 }}>
      {label}
      {hint && (
        <span
          style={{ display: "block", marginTop: 2, fontSize: 12, opacity: 0.7 }}
        >
          {hint}
        </span>
      )}
    </span>
  );

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      aria-labelledby="confirm-dialog"
    >
      <DialogTitle id="confirm-dialog">
        {title || i18n.t("common.confirmation")}
      </DialogTitle>
      <DialogContent dividers>
        {children ? children : i18n.t("common.areyousure")}
        {checkbox && (
          <FormControlLabel
            control={
              <Switch
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
                name="confirmSwitch"
                color="primary"
              />
            }
            label={switchLabel(checkbox)}
            style={{ display: "flex", marginTop: 16, alignItems: "flex-start" }}
          />
        )}
        {checkboxes.map(item => (
          <FormControlLabel
            key={item.name}
            control={
              <Switch
                checked={!!extra[item.name]}
                onChange={e =>
                  setExtra(prev => ({ ...prev, [item.name]: e.target.checked }))
                }
                name={item.name}
                color="primary"
              />
            }
            label={switchLabel(item.label, item.hint)}
            style={{ display: "flex", marginTop: 8, alignItems: "flex-start" }}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => onClose(false)}
          color="default"
        >
          {i18n.t("confirmationModal.buttons.cancel")}
        </Button>
        <Button
          disabled={!okEnabled}
          variant="contained"
          onClick={() => {
            onClose(false);
            onConfirm(checked, extra);
          }}
          color="secondary"
        >
          {i18n.t("confirmationModal.buttons.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;

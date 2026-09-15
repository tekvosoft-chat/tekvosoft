import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import { Button, CircularProgress } from "@material-ui/core";
import PhotoCameraRoundedIcon from "@material-ui/icons/PhotoCameraRounded";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";

import UserAvatar from "../ui/UserAvatar";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(1)
  },
  avatarWrap: { position: "relative", flex: "none" },
  badge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.tkv.brand.main,
    color: theme.palette.tkv.brand.contrastText,
    border: `2px solid ${theme.palette.tkv.surface}`,
    "& svg": { fontSize: 16 }
  },
  actions: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  hint: { fontSize: "0.75rem", color: theme.palette.text.secondary }
}));

/**
 * Foto do perfil dentro do modal do usuário: escolher, trocar e remover.
 * O envio é imediato (não espera o "Salvar" do formulário), porque é um
 * arquivo e não um campo de texto.
 */
const ProfileImageField = ({ userId, user, onChange }) => {
  const classes = useStyles();
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  if (!userId) return null;

  const send = async file => {
    if (!file) return;
    setLoading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await api.put(`/users/${userId}/profile-image`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onChange(response.data?.profileImage || null);
      toast.success(i18n.t("userModal.photo.saved"));
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const remove = async () => {
    setLoading(true);
    try {
      await api.delete(`/users/${userId}/profile-image`);
      onChange(null);
      toast.success(i18n.t("userModal.photo.removed"));
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  return (
    <div className={classes.root}>
      <span className={classes.avatarWrap}>
        <UserAvatar user={user} size={72} />
        <span className={classes.badge}>
          {loading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <PhotoCameraRoundedIcon />
          )}
        </span>
      </span>
      <div className={classes.actions}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={e => {
            send(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button
          size="small"
          color="primary"
          variant="outlined"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {user?.profileImage
            ? i18n.t("userModal.photo.change")
            : i18n.t("userModal.photo.add")}
        </Button>
        {user?.profileImage && (
          <Button
            size="small"
            color="secondary"
            disabled={loading}
            startIcon={<DeleteOutlineRoundedIcon />}
            onClick={remove}
          >
            {i18n.t("userModal.photo.remove")}
          </Button>
        )}
        <span className={classes.hint}>{i18n.t("userModal.photo.hint")}</span>
      </div>
    </div>
  );
};

export default ProfileImageField;

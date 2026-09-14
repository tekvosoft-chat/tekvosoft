import { useEffect, useState } from "react";
import { setPushSilent } from "../../services/push";

/**
 * Som das notificações, ligado ou desligado neste aparelho.
 *
 * Fica guardado no próprio navegador: cada pessoa escolhe no seu celular ou
 * computador, sem mudar nada para o resto da equipe. Ligado por padrão, que
 * era o comportamento de antes.
 */
const KEY = "notificationSound";
const EVENT = "tkv:notification-sound";

export const isNotificationSoundOn = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch (err) {
    return true;
  }
};

export const setNotificationSoundOn = on => {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch (err) {
    // navegador sem armazenamento: vale só até recarregar
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: !!on }));
  // notificações push deste aparelho chegam com ou sem som também
  setPushSilent(!on);
};

const useNotificationSound = () => {
  const [on, setOn] = useState(isNotificationSoundOn);

  useEffect(() => {
    const onChange = event => setOn(event.detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  return [on, setNotificationSoundOn];
};

export default useNotificationSound;

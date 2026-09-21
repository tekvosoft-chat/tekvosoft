// ESC na conversa. Com janela, menu, visualizador de fotos ou lista de
// sugestões aberta por cima, o ESC é deles: a conversa não fecha junto.
const OVERLAYS =
  ".MuiDialog-root, .MuiPopover-root, .MuiAutocomplete-popper, .yarl__root";

export const overlayOpen = () =>
  Array.from(document.querySelectorAll(OVERLAYS)).some(
    // menus com keepMounted ficam no DOM escondidos
    el => el.style.visibility !== "hidden"
  );

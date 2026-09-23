import { shield } from "../../packages/excalidraw/components/icons";
import { Tooltip } from "../../packages/excalidraw/components/Tooltip";
import { useI18n } from "../../packages/excalidraw/i18n";

export const EncryptedIcon = () => {
  const { t } = useI18n();

  return (
    <span className="encrypted-icon tooltip" aria-label={t("encrypted.link")}>
      <Tooltip label={t("encrypted.tooltip")} long={true}>
        {shield}
      </Tooltip>
    </span>
  );
};

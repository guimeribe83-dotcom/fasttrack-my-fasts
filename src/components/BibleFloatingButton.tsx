import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import bibliaIcon from "@/assets/biblia.png";

export const BibleFloatingButton = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/biblia");
  };

  return (
    <Button
      onClick={handleClick}
      size="icon"
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white z-40 animate-scale-in"
      aria-label={t("floatingButton.openBible")}
    >
      <img src={bibliaIcon} alt="Bíblia" className="h-7 w-7" />
    </Button>
  );
};

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Languages, Palette, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

const Configuracoes = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userTheme, setUserTheme] = useState<string>("system");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    // Load user theme preference
    const { data: profile } = await supabase
      .from("profiles")
      .select("theme_preference")
      .eq("id", session.user.id)
      .single();
    
    if (profile?.theme_preference) {
      setUserTheme(profile.theme_preference);
      setTheme(profile.theme_preference);
    }
    
    setLoading(false);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    toast({
      title: t("settings.success"),
    });
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    setUserTheme(newTheme);
    
    // Save to database
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase
        .from("profiles")
        .update({ theme_preference: newTheme })
        .eq("id", session.user.id);
    }
    
    toast({
      title: t("settings.themeSuccess"),
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t("settings.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("settings.description")}
          </p>
        </div>

        <div className="space-y-4">
          {/* Card de Tema */}
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{t("settings.theme")}</CardTitle>
                  <CardDescription className="text-sm">
                    {t("settings.themeDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-medium">
                  {t("settings.selectTheme")}
                </Label>
                <Select value={userTheme} onValueChange={handleThemeChange}>
                  <SelectTrigger id="theme" className="w-full h-11">
                    <SelectValue placeholder={t("settings.selectTheme")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        <span>{t("settings.themes.light")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        <span>{t("settings.themes.dark")}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        <span>{t("settings.themes.system")}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Card de Idioma */}
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Languages className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{t("settings.language")}</CardTitle>
                  <CardDescription className="text-sm">
                    {t("settings.languageDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-medium">
                  {t("settings.selectLanguage")}
                </Label>
                <Select value={i18n.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger id="language" className="w-full h-11">
                    <SelectValue placeholder={t("settings.selectLanguage")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">🇧🇷 {t("settings.languages.pt")}</SelectItem>
                    <SelectItem value="en">🇺🇸 {t("settings.languages.en")}</SelectItem>
                    <SelectItem value="es">🇪🇸 {t("settings.languages.es")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Configuracoes;

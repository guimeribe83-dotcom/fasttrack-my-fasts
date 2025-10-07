import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User, Camera, Loader2, LogOut, Settings, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

export default function Perfil() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [church, setChurch] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (authProfile) {
      setFullName(authProfile.full_name || "");
      setChurch(authProfile.church || "");
      setAvatarUrl(authProfile.avatar_url || "");
    }
  }, [authProfile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Usuário não encontrado");

      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Save avatar_url to database immediately
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      await refreshProfile();

      toast({
        title: t("profile.photoUpdated"),
        description: t("profile.photoUpdatedMessage"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("profile.uploadError"),
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Usuário não encontrado");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          church: church,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: t("profile.success"),
        description: t("profile.successMessage"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    } else {
      navigate("/auth");
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    toast({
      title: t("settings.success"),
    });
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("profile.title")}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t("profile.subtitle")}
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t("profile.title")}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t("settings.title")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Avatar Section */}
            <Card className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-border">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                      {fullName ? fullName.charAt(0).toUpperCase() : <User className="w-12 h-12" />}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 w-10 h-10 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center cursor-pointer transition-colors border-4 border-background"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {t("profile.clickToChange")}
                </p>
              </div>
            </Card>

            {/* Profile Info */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    {t("profile.fullName")}
                  </Label>
                  <Input
                    id="fullName"
                    placeholder={t("profile.fullNamePlaceholder")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="church" className="text-sm font-medium">
                    {t("profile.church")}
                  </Label>
                  <Input
                    id="church"
                    placeholder={t("profile.churchPlaceholder")}
                    value={church}
                    onChange={(e) => setChurch(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-11 bg-gradient-primary hover:opacity-90"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    {t("profile.saving")}
                  </>
                ) : (
                  t("profile.save")
                )}
              </Button>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full h-11 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-2 w-4 h-4" />
                {t("profile.logout")}
              </Button>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Languages className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">{t("settings.language")}</h3>
                    <p className="text-sm text-muted-foreground">{t("settings.languageDescription")}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">{t("settings.selectLanguage")}</Label>
                  <Select value={i18n.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger id="language" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">{t("settings.languages.pt")}</SelectItem>
                      <SelectItem value="en">{t("settings.languages.en")}</SelectItem>
                      <SelectItem value="es">{t("settings.languages.es")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

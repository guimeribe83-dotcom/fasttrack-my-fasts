import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Heart, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface EmotionalCheckInProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: {
    feeling_rating: number;
    emotional_tags: string[];
    daily_note: string;
  }) => void;
}

const emotionalTags = [
  { value: 'grateful', icon: '🙏', color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
  { value: 'renewed', icon: '✨', color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20' },
  { value: 'tired', icon: '😴', color: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20' },
  { value: 'tempted', icon: '⚔️', color: 'bg-red-500/10 text-red-600 hover:bg-red-500/20' },
  { value: 'peaceful', icon: '🕊️', color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20' },
  { value: 'hopeful', icon: '🌟', color: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' },
];

export default function EmotionalCheckIn({ open, onOpenChange, onComplete }: EmotionalCheckInProps) {
  const { t } = useTranslation();
  const [feelingRating, setFeelingRating] = useState<number>(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dailyNote, setDailyNote] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleComplete = () => {
    onComplete({
      feeling_rating: feelingRating,
      emotional_tags: selectedTags,
      daily_note: dailyNote,
    });
    // Reset form
    setFeelingRating(3);
    setSelectedTags([]);
    setDailyNote('');
    onOpenChange(false);
  };

  const handleSkip = () => {
    onComplete({
      feeling_rating: 0,
      emotional_tags: [],
      daily_note: '',
    });
    setFeelingRating(3);
    setSelectedTags([]);
    setDailyNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            {t("checkIn.title")}
          </DialogTitle>
          <DialogDescription>
            {t("checkIn.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feeling Rating */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              {t("checkIn.feelingRating")}
            </Label>
            <div className="space-y-2">
              <Slider
                value={[feelingRating]}
                onValueChange={(values) => setFeelingRating(values[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("checkIn.weak")}</span>
                <span className="font-bold text-lg text-primary">{feelingRating}/5</span>
                <span>{t("checkIn.strong")}</span>
              </div>
            </div>
          </div>

          {/* Emotional Tags */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {t("checkIn.howAreYouFeeling")}
            </Label>
            <div className="flex flex-wrap gap-2">
              {emotionalTags.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedTags.includes(tag.value) ? tag.color : "hover:bg-accent"
                  )}
                  onClick={() => toggleTag(tag.value)}
                >
                  <span className="mr-1">{tag.icon}</span>
                  {t(`journal.tags.${tag.value}`)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Daily Note */}
          <div className="space-y-2">
            <Label htmlFor="dailyNote">{t("checkIn.notes")}</Label>
            <Textarea
              id="dailyNote"
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value)}
              placeholder={t("checkIn.notesPlaceholder")}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1"
          >
            {t("checkIn.skip")}
          </Button>
          <Button
            onClick={handleComplete}
            className="flex-1"
          >
            {t("checkIn.complete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { memo } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NoteCardProps {
  id: string;
  title: string;
  summary?: string | null;
  content: string;
  tags: string[];
  updatedAt: string | Date;
  linkable?: boolean;
}

export const NoteCard = memo(function NoteCard({
  id,
  title,
  summary,
  content,
  tags,
  updatedAt,
  linkable = true,
}: NoteCardProps) {
  const preview = summary || content.slice(0, 120);

  const card = (
    <Card className="group h-full transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-base group-hover:text-primary">
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(updatedAt)}
        </p>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground">{preview}</p>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!linkable) return card;

  return <Link href={`/dashboard/notes/${id}`}>{card}</Link>;
});
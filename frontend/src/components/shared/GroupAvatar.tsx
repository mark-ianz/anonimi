"use client";

import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";

interface GroupAvatarProps {
  imageUrl?: string | null;
  fallbackProfileImages?: Array<string | null>;
  name?: string | null;
  className?: string;
  roundedClassName?: string;
  textClassName?: string;
  alt?: string;
}

export default function GroupAvatar({
  imageUrl,
  fallbackProfileImages,
  name,
  className,
  roundedClassName = "rounded-full",
  textClassName,
  alt,
}: GroupAvatarProps) {
  if (imageUrl) {
    return (
      <UserAvatar
        imageUrl={imageUrl}
        name={name}
        alt={alt ?? name ?? "Group"}
        className={className}
        roundedClassName={roundedClassName}
        textClassName={textClassName}
      />
    );
  }

  const images = (fallbackProfileImages ?? []).slice(0, 3);

  if (images.length <= 1) {
    return (
      <UserAvatar
        imageUrl={images[0] ?? null}
        name={name}
        alt={alt ?? name ?? "Group"}
        className={className}
        roundedClassName={roundedClassName}
        textClassName={textClassName}
      />
    );
  }

  if (images.length === 2) {
    return (
      <div className={cn("relative isolate", className)}>
        <div className="absolute left-[4%] top-[10%] h-[68%] w-[68%] z-20 rounded-full overflow-hidden">
          <UserAvatar
            imageUrl={images[0]}
            name="Member"
            alt="Group member"
            className="w-full h-full"
            roundedClassName="rounded-full"
            textClassName="text-[9px]"
          />
        </div>
        <div className="absolute right-[4%] bottom-[10%] h-[68%] w-[68%] z-10 rounded-full overflow-hidden border border-background/70">
          <UserAvatar
            imageUrl={images[1]}
            name="Member"
            alt="Group member"
            className="w-full h-full"
            roundedClassName="rounded-full"
            textClassName="text-[9px]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative isolate", className)}>
      <div className="absolute left-[2%] top-[18%] h-[64%] w-[64%] z-30 rounded-full overflow-hidden">
        <UserAvatar
          imageUrl={images[0]}
          name="Member"
          alt="Group member"
          className="w-full h-full"
          roundedClassName="rounded-full"
          textClassName="text-[9px]"
        />
      </div>
      <div className="absolute right-[0%] top-[4%] h-[50%] w-[50%] z-20 rounded-full overflow-hidden border border-background/70">
        <UserAvatar
          imageUrl={images[1]}
          name="Member"
          alt="Group member"
          className="w-full h-full"
          roundedClassName="rounded-full"
          textClassName="text-[9px]"
        />
      </div>
      <div className="absolute right-[0%] bottom-[4%] h-[50%] w-[50%] z-10 rounded-full overflow-hidden border border-background/70">
        <UserAvatar
          imageUrl={images[2]}
          name="Member"
          alt="Group member"
          className="w-full h-full"
          roundedClassName="rounded-full"
          textClassName="text-[9px]"
        />
      </div>
    </div>
  );
}

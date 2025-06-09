import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StaticCardProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
  id: string;
}

export function StaticCard({
  title,
  children,
  defaultCollapsed = false,
  className,
  onCollapseChange,
  id,
}: StaticCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  return (
    <Card className={cn("transition-all", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {title}
          </CardTitle>
          <div className="cursor-pointer" onClick={handleCollapse}>
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && <CardContent>{children}</CardContent>}
    </Card>
  );
} 
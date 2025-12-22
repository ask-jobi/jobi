import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import {Card, CardContent, CardHeader} from "@/components/ui/card";

function SkeletonCard() {
  return (
    <Card className="flex flex-col space-y-6">
      <CardHeader>
        <Skeleton className="h-6 w-24 rounded-xl"/>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4"/>
          <Skeleton className="h-4"/>
          <Skeleton className="h-4"/>
          <Skeleton className="h-4"/>
          <Skeleton className="h-4 w-[80%]"/>
        </div>
      </CardContent>
    </Card>
  );
}

export default SkeletonCard;

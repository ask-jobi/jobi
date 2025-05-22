import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/server";
import { log } from "console";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: instruments } = await supabase.from("instruments").select();

  console.log(instruments);
  

  return (
    <div className="p-6">
      <div className="grid xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <Card className="aspect-[1/1.414]">
          <CardContent>
            <p>First Resume</p>
          </CardContent>
        </Card>

        <Dialog>
          <DialogTrigger asChild>
            <Card 
              className="aspect-[1/1.414] border-dashed cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary"
            >
              <CardContent className="flex items-center justify-center h-full">
                <p className="text-lg font-medium text-muted-foreground select-none">Create New Resume</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
      </div>
    </div>
  );
}
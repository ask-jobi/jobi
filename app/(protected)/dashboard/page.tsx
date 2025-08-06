import NewResumeCard from "@/components/client-components/new-resume-card";
import {Card, CardContent} from "@/components/ui/card";
import {fetchJobApplication} from "@/server/resume";
import Link from "next/link";

export default async function Dashboard() {
  const data = await fetchJobApplication()

  return (
    <div className="h-[calc(100vh-3rem)] p-6 overflow-y-auto">
      <div className="grid xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <NewResumeCard/>
        {
          data?.map(it => {
            return (
              <Link key={it.id} href={`/application/${it.id}`}>
                <Card className="aspect-[1/1.414] hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent>
                    <p>{it.id}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        }
      </div>
    </div>
  );
}

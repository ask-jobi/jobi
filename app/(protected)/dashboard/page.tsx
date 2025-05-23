import NewResumeCard from "@/components/client-components/new-resume-card";
import {Card, CardContent} from "@/components/ui/card";
import {fetchResume} from "@/server/resume";

export default async function Dashboard() {
  const data = await fetchResume()
  console.log(data)

  return (
    <div className="p-6">
      <div className="grid xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {
          data?.map(it => {
            return (
              <Card key={it.id} className="aspect-[1/1.414]">
                <CardContent>
                  <p>{it.id}</p>
                </CardContent>
              </Card>
            )
          })
        }
        <NewResumeCard/>
      </div>
    </div>
  );
}

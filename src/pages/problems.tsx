import { ProblemCard } from ".";
import { trpc } from "../utils/trpc";

export default function Problems() {
    const votes = trpc.vote.get.useQuery();
    const problemsInDb = trpc.problem.get.useQuery();
    const problems = problemsInDb.data;
    return <>
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4 w-full">
        <p className="text-2xl text-gray-700 py-5">These are all the problems</p>
        {
            problems && problems.map((problem) => {
                return (
                    <ProblemCard 
                        key={problem.id}
                        description={problem.description} 
                        votingIsOngoing={false} 
                        vote={() => false}
                        voted={true}
                        votes={votes.data?.filter((vote) => vote.problemId === problem.id).length || 0}
                    />
                )
            })
        }
    </div>
    </>
}
import type { NextPage } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Problem } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";

const Home: NextPage = () => {
  const browserIdentity = trpc.browser.store.useMutation();
  const addToProblems = trpc.problem.add.useMutation();
  const problemsInDb = trpc.problem.get.useQuery();
  const voteForProblem = trpc.vote.add.useMutation();
  const votes = trpc.vote.get.useQuery();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{problem: string}>();
  const [signature, setSignature] = useState<string>();
  const [problem, onChangeProblem] = useState<string>();
  const [problems, setProblems] = useState<Problem[]>();

  const problemButtonText = useMemo(() => {
    let problemButtonText = "Add to my problems";
    if (problems && problems.length > 0) {
      problemButtonText  = 'No, submit my problem'
    }

    return problemButtonText
  }, [problems])

  // Initialize an agent at application startup.
const fingerPrint = useMemo(async () => {
  const fp = await FingerprintJS.load()
  const result = await fp.get()

  return result.visitorId
}, []);

useEffect(() => {
  let start = true;
  const getBrowserSignature = async () => {
    if (start && !signature) {
      const signature =  await fingerPrint;
    
      if (!signature) throw new TRPCClientError('Cannot create browser signature');
      await browserIdentity.mutateAsync({signature})

      setSignature(signature);
    }
  }

  getBrowserSignature()

  return () => { start = false }

}, [])

useEffect(() => {
  const availableProblems = problemsInDb.data
  if (availableProblems && problem) {
    const filteredProblems = availableProblems.filter((p: Problem) => p.description.toLowerCase().includes(problem.toLowerCase()))
    setProblems(filteredProblems);
  }
}, [problem])

const addToYourProblems = async (data: {
  problem: string;
}) => {
  if (!signature) throw new TRPCClientError('could not generate browser signature');
  
  await addToProblems.mutateAsync({
    problem: data.problem, 
    signature,
  })
  reset();
  problemsInDb.refetch()
  votes.refetch();
}

const handleVoting = async (problemId: string) => {
  if (!signature) throw new TRPCClientError('could not generate browser signature');

  await voteForProblem.mutateAsync({
    problemId, 
    signature: signature
  })
  votes.refetch()
}

  return (
    <>
      <Head>
        <title>I need a solution</title>
        <meta name="description" content="Solution finder" />
        <link rel="icon" href="/favicon.ico" />
        <script defer data-domain="ineedasolution.online" src="https://plausible.io/js/plausible.js"></script>
      </Head>
      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
        {browserIdentity.data?.returning && <span className="text-gray-700 text-center">Welcome ????????</span>}
        <h1 className="text-5xl font-extrabold leading-normal text-gray-700 md:text-[5rem] text-center ">
          I need a <span className="text-purple-300">solution</span>
        </h1>
        <span className="text-gray-700 text-center">Are you looking for a solution to a problem that has not been solved? Type it here, someone is probably interested in building it for you ????</span>
        <span className="py-4"></span>
         <form className="w-full py-7 text-center items-center" onSubmit={handleSubmit(addToYourProblems)}>
          <div className="w-full py-4 text-center">
            <textarea {...register('problem', { required: 'Tell us your problem' })} onChange={(e) => onChangeProblem(e.currentTarget.value)} className="w-full textarea block rounded-md border-gray-300 pl-7 pr-12 focus:border-purple-700 focus:ring-purple-700 text-center" placeholder='What problem do you need a solution to?'></textarea>
            {(errors.problem?.message || addToProblems.isError) && <span className="text-red-400">{errors.problem?.message || addToProblems?.error?.message}</span>}
          </div>
          {problems && <> 
              <span className="py-3"></span>
              {problems.length > 0 && <p className="text-2xl text-gray-700">Is the problem similar to any of these?</p>}
              <p className="text-sm text-gray-700 py-3">Problems with the most votes will likely get solutions built for faster</p>
              
              { problems && problems?.length > 4 && <div className="w-full text-center my-3">
                <button 
                  type={'submit'} 
                  disabled={(addToProblems.isLoading || browserIdentity.isLoading)}
                  className="rounded-md px-6 py-4 text-sm text-white bg-purple-700">
                    {`${(addToProblems.isLoading || browserIdentity.isLoading) ? 'Loading...' : problemButtonText}`}
                </button>
              </div>}

              <span className="py-4"></span>
              <div className="flex flex-col w-full">
                {problems && votes.data && problems.map((problem) => {
                  return <ProblemCard 
                        key={problem.id}
                        description={problem.description} 
                        votingIsOngoing={voteForProblem.isLoading} 
                        vote={() => handleVoting(problem.id)}
                        voted={votes.data?.some((vote) => {
                          const signature = browserIdentity.data?.browser.signature;
                          return (vote.problemId === problem.id && vote.browserSignature === signature)
                        }) ?? false}
                        votes={votes.data?.filter((vote) => vote.problemId === problem.id).length}
                      />
                })}
              </div>
              <div className="w-full text-center my-3">
                <button 
                  type={'submit'} 
                  disabled={(addToProblems.isLoading || browserIdentity.isLoading)}
                  className="rounded-md px-6 py-4 text-sm text-white bg-purple-700">
                    {`${(addToProblems.isLoading || browserIdentity.isLoading) ? 'Loading...' : problemButtonText}`}
                </button>
              </div>
          </>
        }
        </form>
      </main>
    </>
  );
};

export default Home;

type ProblemCardProps = {
  description: string;
  vote: (...a: any) => any;
  votingIsOngoing: boolean;
  voted: boolean;
  votes: number;
};

export const ProblemCard = ({
  description,
  vote,
  votingIsOngoing,
  voted,
  votes,
}: ProblemCardProps) => {
  const votedText = (votes: number) => voted ? `Voted ${votes} ${votes > 1 ? 'times' : 'time'}` : 'Upvote ????'
  return (
    <section className="flex flex-row my-1 w-full justify-between rounded border-2 border-gray-500 p-6 shadow-xl duration-500 motion-safe:hover:scale-105">
      <p className="text-sm text-gray-600 pb-3 w-[90%] text-left">{description}</p>
      
      <button
        type={'button'} 
        onClick={vote}
        disabled={votingIsOngoing || voted}
        className="text-purple-500"
      >
        {`${votingIsOngoing ? 'Voting...' : votedText(votes)}`}
      </button>
    </section>
  );
};

import { useTina } from 'tinacms/dist/react'

export default function TinaContent({ query, variables, data }: {
  query: string
  variables: object
  data: any
}) {
  const { data: tinaData } = useTina({
    query,
    variables,
    data
  })

  return (
    <div>
      {/* Render your content here using tinaData */}
      <h1>{tinaData?.post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: tinaData?.post.body }} />
    </div>
  )
}

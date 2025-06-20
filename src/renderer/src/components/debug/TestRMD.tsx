import ReactMarkdown from 'react-markdown';

export function TestRMD() {
  const children = `This is markdown content.`;

  return (
    <div>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}

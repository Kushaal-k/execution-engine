interface OutputAreaProps {
    stdout: string | null
}

function OutputArea(
    {stdout} : OutputAreaProps
) {
  return (
    <div className="bg-gray-800 w-full min-h-4 text-gray-400 px-4 py-2 m-4 border border-black">
        {stdout}
    </div>
  )
}

export default OutputArea
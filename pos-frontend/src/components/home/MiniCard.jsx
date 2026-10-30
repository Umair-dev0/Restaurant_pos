const MiniCard = ({ title, icon, value, description }) => {
  return (
    <div className='bg-[#1a1a1a] py-5 px-5 rounded-lg w-[50%] min-w-0'>
        <div className='flex items-start justify-between'>
            <h1 className='text-[#f5f5f5] text-lg font-semibold tracking-wide'>{title}</h1>
            <span className={`${title === "Total Earnings" ? "bg-[#02ca3a]" : "bg-[#f6b100]"} p-3 rounded-lg text-[#f5f5f5] text-2xl`}>{icon}</span>
        </div>
        <div>
            <h2 className='text-[#f5f5f5] text-2xl md:text-4xl font-bold mt-5'>{value}</h2>
            <p className='text-[#ababab] text-sm mt-2'>{description}</p>
        </div>
    </div>
  )
}

export default MiniCard
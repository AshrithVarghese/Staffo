import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom' 

export default function Landing() {
    const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full relative">
      {/* Dashed Top Fade Grid */}
      <div
        className="absolute inset-0 -z-50"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e7e5e4 1px, transparent 1px),
            linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 0",
          maskImage: `
            repeating-linear-gradient(
                  to right,
                  black 0px,
                  black 3px,
                  transparent 3px,
                  transparent 8px
                ),
                repeating-linear-gradient(
                  to bottom,
                  black 0px,
                  black 3px,
                  transparent 3px,
                  transparent 8px
                ),
                radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
          `,
          WebkitMaskImage: `
    repeating-linear-gradient(
                  to right,
                  black 0px,
                  black 3px,
                  transparent 3px,
                  transparent 8px
                ),
                repeating-linear-gradient(
                  to bottom,
                  black 0px,
                  black 3px,
                  transparent 3px,
                  transparent 8px
                ),
                radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />


    <div className="min-h-screen flex flex-col items-center justify-center from-white to-gray-50 px-6 mb-30">
      <div className="max-w-4xl w-full items-center">
        <div className="flex flex-col gap-6">
          <img src="/staffo.png" alt="Staffo" className="w-30 absolute top-8 left-5" onClick={()=>{navigate('/')}}/>
          {/* <button onClick={()=>navigate('/login')} className='absolute top-9 right-5 bg-black text-white px-5 py-2 rounded-lg font-medium cursor-pointer'>Login</button> */}
          <img src="/Jyothi Logo Blue.png" alt="Jyothi Logo" className='w-30 absolute right-5 top-9'/>

          <h1 className="text-5xl md:text-5xl font-bold text-center mt-40">Staffo <br/> <span className='font-semibold text-3xl'> Simple staff locator</span></h1>
          <p className="text-gray-600 text-sm text-center">Sign in with your JECC account to locate where your staff is or check if they are available.</p>

          <div className="flex gap-3 mt-4 justify-center">
            <Link to="/login" className="inline-block bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-lg font-medium">Get Started</Link>
            <a onClick={()=>navigate('/login')} className="inline-block border bg-white border-black hover:bg-gray-100 text-gray-700 px-5 py-3 rounded-lg">Login</a>
          </div>
        </div>

        <div className="bg-white rounded-2xl mt-10" id='features'>
          <h3 className="text-2xl font-semibold mb-10 text-center">Why Staffo?</h3>
          <ul className="text-gray-700 border border-black rounded-lg">
            <li className='border border-black w-fit px-2 py-0.5 rounded-full bg-black text-white text-sm ml-2 -mt-3'># Real time status</li>
            <p className="text-sm p-3">Get the realtime status of your staff to know their availability and location.</p>
          </ul>

          <ul className="text-gray-700 mt-5 border border-black rounded-lg">
            <li className='border border-black w-fit px-2 py-0.5 rounded-full bg-black text-white text-sm ml-2 -mt-3'># Fast & Simple</li>
            <p className="text-sm p-3">Minimal UI built for quick access. No clutter, no confusion.</p>
          </ul>
        </div>

        <div className="mt-10 mb-20 bg-black text-white p-5 rounded-xl">
            <p className="text-sm">
              Ready to check staff availability instantly?
            </p>

            <button onClick={()=>navigate('/login')} className='bg-white text-black px-2 py-1 rounded-lg mt-3 font-medium w-full cursor-pointer'>Try Staffo</button>
        </div>

        {/* <img src="/Jyothi Logo Blue.png" alt="Jyothi Logo" className='w-60 items-center mx-auto opacity-80'/> */}
      </div>

      <p className='text-xs text-gray-400 fixed bottom-0'>version 1.0.0</p>


    </div>
  </div>
  )
}

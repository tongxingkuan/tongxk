import { useEffect } from 'react'

function Home() {
  useEffect(() => {
    return () => {
      console.log('home unmount')
    }
  }, [])
  return <div>Home</div>
}
export default Home

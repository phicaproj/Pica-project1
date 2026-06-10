import { Suspense } from 'react'
import ResultPage from '@/app/View/ResultView'

const page = () => {
	return (
		<Suspense fallback={null}>
			<ResultPage />
		</Suspense>
	)
}

export default page

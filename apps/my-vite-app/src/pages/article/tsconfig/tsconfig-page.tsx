import { createComponent } from 'shared'
import { html as tsconfig } from './tsconfig.md'
import MdViewer from 'src/components/viewer/md-viewer'

export const TsconfigPage = createComponent(null, () => {
  return () => (
    <div class="flex justify-between">
      <x-markdown-content class="block w-full">
        <MdViewer content={tsconfig} />
      </x-markdown-content>
      <x-anchor />
    </div>
  )
})

export default TsconfigPage

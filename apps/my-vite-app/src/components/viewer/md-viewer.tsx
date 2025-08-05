import { createComponent } from 'shared'
import { ref } from 'vue'

type ViewerOptions = {
  props: {
    content: string
  }
}
export const MdViewer = createComponent<ViewerOptions>(
  {
    props: {
      content: '',
    },
  },
  props => {
    const viewerRef = ref<HTMLDivElement>()

    return () => <div ref={viewerRef} innerHTML={props.content} />
  }
)

export default MdViewer

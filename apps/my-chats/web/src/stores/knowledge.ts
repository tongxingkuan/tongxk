import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as kbApi from '../api/knowledge'
import type { KnowledgeBase } from '../api/knowledge'

export const useKnowledgeStore = defineStore('knowledge', () => {
  const bases = ref<KnowledgeBase[]>([])
  const ragEnabled = ref(false)
  const loaded = ref(false)

  async function load() {
    const [list, rag] = await Promise.all([kbApi.listBases(), kbApi.getRag()])
    bases.value = list
    ragEnabled.value = rag
    loaded.value = true
  }

  async function createBase(name: string) {
    const base = await kbApi.createBase(name)
    bases.value.unshift(base)
    return base
  }

  async function removeBase(id: string) {
    await kbApi.removeBase(id)
    bases.value = bases.value.filter(b => b.id !== id)
  }

  async function uploadDocument(baseId: string, file: File) {
    return kbApi.uploadDocument(baseId, file)
  }

  async function toggleRag(enabled: boolean) {
    await kbApi.setRag(enabled)
    ragEnabled.value = enabled
  }

  return { bases, ragEnabled, loaded, load, createBase, removeBase, uploadDocument, toggleRag }
})

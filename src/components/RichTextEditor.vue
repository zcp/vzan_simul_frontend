<template>
  <div class="rich-editor-wrapper">
    <Toolbar
      :editor="editor"
      :defaultConfig="toolbarConfig"
      :mode="mode"
      style="border-bottom: 1px solid #eee"
    />
    <Editor
      v-model="innerHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      style="height: 260px;"
      @onCreated="handleCreated"
    />
  </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'
import { shallowRef, onBeforeUnmount, watch } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

const props = defineProps<{
  modelValue: string
}>()
const emits = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

// 编辑器实例
const editor = shallowRef<any>(null)
const mode = 'default'

// 内部 html，同步到父组件的 modelValue
const innerHtml = shallowRef(props.modelValue || '')

// 外 → 内 同步（父改了值）
watch(
  () => props.modelValue,
  (val) => {
    if (val !== innerHtml.value) {
      innerHtml.value = val || ''
    }
  }
)

// 内 → 外 同步（编辑器改了值）
watch(
  innerHtml,
  (val) => {
    emits('update:modelValue', val || '')
  }
)

const toolbarConfig = {
  toolbarKeys: [
    'headerSelect',
    'bold',
    'italic',
    'underline',
    'color',
    'bgColor',
    'bulletedList',
    'numberedList',
    'link',
    'image',
    'quote',
    'divider',
    'undo',
    'redo',
  ],
}

const editorConfig = {
  placeholder: '在此编辑图文内容...',
}

const handleCreated = (ed: any) => {
  editor.value = ed
}

onBeforeUnmount(() => {
  const ed = editor.value
  if (ed == null) return
  ed.destroy()
})
</script>

<style scoped>
.rich-editor-wrapper {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
:deep(.w-e-panel-container) {
  z-index: 3000 !important;
}
</style>
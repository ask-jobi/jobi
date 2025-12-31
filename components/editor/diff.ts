import {JSONContent} from "@tiptap/core";
import {diffChars} from "diff";

function unwrapDoc(json: JSONContent): JSONContent[] {
  if (json.type === 'doc') {
    return json.content ?? []
  }
  return [json]
}

// 计算文本差异，返回带有删除和插入标记的文本节点数组
function diffText(beforeText: string, afterText: string): JSONContent[] {
  if (beforeText === afterText) {
    return [{ type: "text", text: beforeText }]
  }

  // 使用 diff 库计算字符级别的差异
  const changes = diffChars(beforeText, afterText)
  const result: JSONContent[] = []

  for (const change of changes) {
    if (change.added) {
      // 新增的文本，标记为 inserted
      result.push({
        type: "text",
        text: change.value,
        marks: [{ type: "inserted" }]
      })
    } else if (change.removed) {
      // 删除的文本，标记为 deleted
      result.push({
        type: "text",
        text: change.value,
        marks: [{ type: "deleted" }]
      })
    } else {
      // 未改变的文本，不添加标记
      result.push({
        type: "text",
        text: change.value
      })
    }
  }

  // 合并相邻的相同标记的文本节点
  return mergeTextNodes(result)
}

// 合并相邻的相同标记的文本节点
function mergeTextNodes(nodes: JSONContent[]): JSONContent[] {
  if (nodes.length === 0) return []
  
  const result: JSONContent[] = []
  let current = { ...nodes[0] } as JSONContent

  for (let i = 1; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === "text" && current.type === "text") {
      const currentMarks = current.marks?.map(m => m.type).sort().join(',') || ''
      const nodeMarks = node.marks?.map(m => m.type).sort().join(',') || ''
      
      if (currentMarks === nodeMarks) {
        current.text = (current.text || '') + (node.text || '')
      } else {
        result.push(current)
        current = { ...node }
      }
    } else {
      result.push(current)
      current = { ...node }
    }
  }
  result.push(current)
  
  return result
}

// 比较两个节点是否结构相同（类型和关键属性相同）
function isSameNodeType(before: JSONContent, after: JSONContent): boolean {
  if (before.type !== after.type) return false
  
  // 对于列表，还需要比较列表类型（bulletList vs orderedList）
  if (before.type === "bulletList" || before.type === "orderedList") {
    return before.type === after.type
  }
  
  return true
}

// 递归比较两个节点
function diffNodes(before: JSONContent, after: JSONContent): JSONContent[] {
  // 如果节点类型不同，整个节点都标记为删除和插入
  if (!isSameNodeType(before, after)) {
    return [
      markNodeAsDeleted(before),
      markNodeAsInserted(after)
    ]
  }

  // 如果是文本节点，进行文本 diff
  if (before.type === "text" && after.type === "text") {
    const beforeText = before.text || ''
    const afterText = after.text || ''
    return diffText(beforeText, afterText)
  }

  // 对于有内容的节点，递归比较子节点
  const beforeContent = before.content || []
  const afterContent = after.content || []
  
  // 比较子节点
  const diffedContent = diffNodeArrays(beforeContent, afterContent)
  
  // 构建结果节点，使用 after 的结构但保留 diff 后的内容
  const result: JSONContent = {
    ...after,
    content: diffedContent
  }
  
  return [result]
}

// 标记整个节点为删除
function markNodeAsDeleted(node: JSONContent): JSONContent {
  if (node.type === "text") {
    return {
      ...node,
      marks: [{ type: "deleted" }, ...(node.marks || [])]
    }
  }
  
  // 对于非文本节点，递归标记所有文本子节点
  const markTextNodesDeleted = (n: JSONContent): JSONContent => {
    if (n.type === "text") {
      return {
        ...n,
        marks: [{ type: "deleted" }, ...(n.marks || [])]
      }
    }
    
    if (n.content) {
      return {
        ...n,
        content: n.content.map(markTextNodesDeleted)
      }
    }
    
    return n
  }
  
  return markTextNodesDeleted(node)
}

// 标记整个节点为插入
function markNodeAsInserted(node: JSONContent): JSONContent {
  if (node.type === "text") {
    return {
      ...node,
      marks: [{ type: "inserted" }, ...(node.marks || [])]
    }
  }
  
  // 对于非文本节点，递归标记所有文本子节点
  const markTextNodesInserted = (n: JSONContent): JSONContent => {
    if (n.type === "text") {
      return {
        ...n,
        marks: [{ type: "inserted" }, ...(n.marks || [])]
      }
    }
    
    if (n.content) {
      return {
        ...n,
        content: n.content.map(markTextNodesInserted)
      }
    }
    
    return n
  }
  
  return markTextNodesInserted(node)
}

// 比较两个节点数组
function diffNodeArrays(beforeArray: JSONContent[], afterArray: JSONContent[]): JSONContent[] {
  const result: JSONContent[] = []
  let beforeIndex = 0
  let afterIndex = 0

  while (beforeIndex < beforeArray.length || afterIndex < afterArray.length) {
    if (beforeIndex >= beforeArray.length) {
      // 只有 after 数组还有节点，全部标记为插入
      result.push(...afterArray.slice(afterIndex).map(markNodeAsInserted))
      break
    }
    
    if (afterIndex >= afterArray.length) {
      // 只有 before 数组还有节点，全部标记为删除
      result.push(...beforeArray.slice(beforeIndex).map(markNodeAsDeleted))
      break
    }

    const beforeNode = beforeArray[beforeIndex]
    const afterNode = afterArray[afterIndex]

    if (isSameNodeType(beforeNode, afterNode)) {
      // 节点类型相同，递归比较
      const diffed = diffNodes(beforeNode, afterNode)
      result.push(...diffed)
      beforeIndex++
      afterIndex++
    } else {
      // 节点类型不同，尝试匹配后面的节点
      let matched = false
      
      // 尝试在 after 数组中查找匹配的 before 节点
      for (let j = afterIndex + 1; j < afterArray.length; j++) {
        if (isSameNodeType(beforeNode, afterArray[j])) {
          // 找到了匹配，中间的节点都是插入的
          result.push(...afterArray.slice(afterIndex, j).map(markNodeAsInserted))
          const diffed = diffNodes(beforeNode, afterArray[j])
          result.push(...diffed)
          beforeIndex++
          afterIndex = j + 1
          matched = true
          break
        }
      }
      
      // 尝试在 before 数组中查找匹配的 after 节点
      if (!matched) {
        for (let i = beforeIndex + 1; i < beforeArray.length; i++) {
          if (isSameNodeType(beforeArray[i], afterNode)) {
            // 找到了匹配，中间的节点都是删除的
            result.push(...beforeArray.slice(beforeIndex, i).map(markNodeAsDeleted))
            const diffed = diffNodes(beforeArray[i], afterNode)
            result.push(...diffed)
            beforeIndex = i + 1
            afterIndex++
            matched = true
            break
          }
        }
      }
      
      // 如果都没找到匹配，当前节点类型不同，标记为删除和插入
      if (!matched) {
        result.push(markNodeAsDeleted(beforeNode))
        result.push(markNodeAsInserted(afterNode))
        beforeIndex++
        afterIndex++
      }
    }
  }

  return result
}

export function calculateDiffJsonContent(beforeContent: JSONContent, afterContent: JSONContent): JSONContent {
  const beforeArray = unwrapDoc(beforeContent)
  const afterArray = unwrapDoc(afterContent)

  const diffedContent = diffNodeArrays(beforeArray, afterArray)

  return {
    type: "doc",
    content: diffedContent
  }
}

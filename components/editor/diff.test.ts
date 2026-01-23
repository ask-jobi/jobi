import { MarkdownManager } from "@tiptap/markdown"
import { calculateDiffJsonContent } from "./diff"
import Document from "@tiptap/extension-document"
import Text from "@tiptap/extension-text"
import Paragraph from "@tiptap/extension-paragraph"
import Heading from "@tiptap/extension-heading"
import { BulletList, ListItem, OrderedList } from "@tiptap/extension-list"
import { Extension } from "@tiptap/react"
import { TrailingNode } from "@tiptap/extensions"
import { describe, it, expect, beforeEach } from "vitest"

describe("diff JSONContent", () => {
  let markdownManager: MarkdownManager

  beforeEach(() => {
    markdownManager = new MarkdownManager()
    const extensions = [
      Document,
      Paragraph,
      Text,
      Heading,
      ListItem,
      OrderedList,
      BulletList,
      TrailingNode
    ]

    extensions.forEach((extension) => {
      markdownManager.registerExtension(extension as Extension)
    })
  })

  it("with simple case", () => {
    const oldJson = markdownManager.parse("12345")
    const newJson = markdownManager.parse("12456")

    const result = calculateDiffJsonContent(oldJson, newJson)

    expect(result).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "12"
            },
            {
              type: "text",
              text: "3",
              marks: [{ type: "deleted" }]
            },
            {
              type: "text",
              text: "45"
            },
            {
              type: "text",
              text: "6",
              marks: [{ type: "inserted" }]
            }
          ]
        }
      ]
    })
  })

  it("with empty case", () => {
    const oldJson = markdownManager.parse("123456")
    const newJson = markdownManager.parse("123456")

    const result = calculateDiffJsonContent(oldJson, newJson)

    expect(result).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "123456"
            }
          ]
        }
      ]
    })
  })

  it("with list case", () => {
    const oldJson = markdownManager.parse("- 12345")
    const newJson = markdownManager.parse("- 12456")

    const result = calculateDiffJsonContent(oldJson, newJson)

    expect(result).toEqual({
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "12"
                    },
                    {
                      type: "text",
                      text: "3",
                      marks: [{ type: "deleted" }]
                    },
                    {
                      type: "text",
                      text: "45"
                    },
                    {
                      type: "text",
                      text: "6",
                      marks: [{ type: "inserted" }]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    })
  })

  it("with node change case", () => {
    const oldJson = markdownManager.parse("- 12345")
    const newJson = markdownManager.parse("12456")

    const result = calculateDiffJsonContent(oldJson, newJson)

    expect(result).toEqual({
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "12345",
                      marks: [{ type: "deleted" }]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "12456",
              marks: [{ type: "inserted" }]
            }
          ]
        }
      ]
    })
  })

  it("with multiple node case", () => {
    const oldJson = markdownManager.parse("- 12345\n1. 54321")
    const newJson = markdownManager.parse("12456\n1. 54333")

    const result = calculateDiffJsonContent(oldJson, newJson)

    expect(result).toEqual({
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "12345",
                      marks: [{ type: "deleted" }]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "12456",
              marks: [{ type: "inserted" }]
            }
          ]
        },
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "543"
                    },
                    {
                      type: "text",
                      text: "21",
                      marks: [{ type: "deleted" }]
                    },
                    {
                      type: "text",
                      text: "33",
                      marks: [{ type: "inserted" }]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    })
  })
})

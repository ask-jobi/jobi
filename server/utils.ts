export const BUCKET_NAME = 'upload-resumes'

export async function getUniqueFileName(supabase: any, userId: string, originalFileName: string): Promise<string> {
    const fileExt = originalFileName.split('.').pop();
    const baseName = originalFileName.slice(0, -(fileExt!.length + 1));
    let counter = 0;
    let fileName = `${userId}/${originalFileName}`;

    while (true) {
        const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .list(userId, {
                search: counter === 0 ? originalFileName : `${baseName}-${counter}.${fileExt}`
            });

        if (error) {
            throw new Error(`Failed to check file existence: ${error.message}`);
        }

        if (!data || data.length === 0) {
            break;
        }

        counter++;
        fileName = `${userId}/${baseName}-${counter}.${fileExt}`;
    }

    return fileName;
}

export function extractFilePathFromPublicUrl(publicUrl: string): string | null {
    try {
      const url = new URL(publicUrl)
      // 提取路径部分，格式: /storage/v1/object/public/upload-resumes/userId/filename.pdf
      const pathParts = url.pathname.split('/')
      // 找到 BUCKET_NAME 的索引，然后取后面的部分
      const bucketIndex = pathParts.indexOf(BUCKET_NAME)
      if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
        return null
      }
      // 提取 userId/filename.pdf
      const filePath = pathParts.slice(bucketIndex + 1).join('/')
      return filePath || null
    } catch (error) {
      console.error('Failed to extract file path from publicUrl:', error)
      return null
    }
  }
  
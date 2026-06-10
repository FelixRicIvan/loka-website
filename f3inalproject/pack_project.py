import os

def pack_project():
    # 定義專案根目錄
    project_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(project_dir, "project_context.txt")
    
    # 定義要排除的目錄和檔案
    exclude_dirs = {".venv", "__pycache__", ".git", "static"}
    exclude_files = {"loka.db", "project_context.txt", "pack_project.py"}
    
    # 支援的檔案副檔名
    valid_extensions = {".py", ".jsx", ".html", ".js", ".css", ".json"}
    
    prompt_content = []
    prompt_content.append("你是一個專業的軟體工程師。以下是我的專案 f3inalproject 的所有原始碼檔案。")
    prompt_content.append("請仔細閱讀這些檔案的內容，並在後續的對話中協助我進行功能修改。\n")
    prompt_content.append("<project_files>")
    
    # 遍歷專案目錄
    for root, dirs, files in os.walk(project_dir):
        # 排除不需要的目錄
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if file in exclude_files:
                continue
                
            _, ext = os.path.splitext(file)
            if ext not in valid_extensions:
                continue
                
            file_path = os.path.join(root, file)
            # 取得相對路徑
            rel_path = os.path.relpath(file_path, project_dir)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 簡化特定檔案以減少 Token 大小，同時不影響 AI 對核心邏輯的理解
                if file == "App.jsx":
                    import re
                    # 替換大段的 defaultBaliItinerary 展示行程
                    content = re.sub(
                        r'const defaultBaliItinerary = \{[\s\S]*?\n\};',
                        'const defaultBaliItinerary = { /* [已精簡] 預設展示行程資料，包含 destination, start_date, end_date, flight_logistics, hotel_logistics, days 等 (約 80 行) */ };',
                        content
                    )
                    # 替換大段的多語系 dictionary
                    content = re.sub(
                        r'const dictionary = \{[\s\S]*?\n\};',
                        'const dictionary = { /* [已精簡] 多語系對照字典，包含 en 與 zh-tw 對譯字詞 (約 190 行) */ };',
                        content
                    )
                
                prompt_content.append(f'\n<file path="{rel_path}">')
                prompt_content.append(content)
                prompt_content.append('</file>')
                print(f"Packed file: {rel_path} (Simplified if applicable)")
            except Exception as e:
                print(f"Failed to read file {rel_path}: {e}")
                
    prompt_content.append("\n</project_files>\n")
    prompt_content.append("現在，請確認你已經理解了專案的結構與內容。接著，我會告訴你我想修改的功能。")
    
    # 寫入輸出檔案
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(prompt_content))
        
    print(f"\nPacking complete! Please copy the content of project_context.txt to Gemini.")

if __name__ == "__main__":
    pack_project()

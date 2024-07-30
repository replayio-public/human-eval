import os
import json

def process_directory(base_path):
    results = []
    
    for root, dirs, files in os.walk(base_path):
        if 'prompt.js' in files:
            # Extract the relative path
            rel_path = os.path.relpath(root, base_path)
            # Split the path into components
            components = rel_path.split(os.sep)
            
            if len(components) == 2:  # Ensure we have both directory and subdirectory
                # Construct the task_id
                task_id = f"{components[0]}/{components[1]}"
                
                # Read the prompt from the file
                with open(os.path.join(root, 'prompt.js'), 'r') as prompt_file:
                    prompt = prompt_file.read().strip()
                
                # Create the JSON object
                json_obj = {
                    "task_id": task_id,
                    "prompt": prompt
                }
                
                results.append(json_obj)
    
    return results

def write_json_file(data, output_file):
    with open(output_file, 'w') as file:
        for item in data:
            json.dump(item, file)
            file.write('\n')

# Usage
base_path = 'prompts'  # The base directory where your prompts are stored
output_file = 'data.jsonl'  # The output JSONL file

data = process_directory(base_path)
write_json_file(data, output_file)

print(f"JSONL file '{output_file}' created successfully.")

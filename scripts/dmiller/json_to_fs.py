import json
import os

def process_json_file(file_path):
    with open(file_path, 'r') as file:
        for line in file:
            data = json.loads(line)
            task_id = data['task_id']
            prompt = data['prompt']
            
            # Split the task_id into directory and subdirectory
            directory, subdirectory = task_id.split('/')
            
            # Create the directory structure
            path = os.path.join(directory, subdirectory)
            os.makedirs(path, exist_ok=True)
            
            # Write the prompt to the file
            with open(os.path.join(path, 'prompt.js'), 'w') as prompt_file:
                prompt_file.write(prompt)

# Usage
input_file = 'data.jsonl'
process_json_file(input_file)

print("Directory structure created successfully.")

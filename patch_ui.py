
import sys

file_path = r'c:/Users/Arvind/OneDrive/Documents/nextLMS/app/(instructor)/instructor/courses/[courseId]/page.js'

with open(file_path, 'r', encoding='utf8') as f:
    lines = f.readlines()

# Lines are 1-indexed in view_file, so subtract 1 for 0-indexed python list
# Line 218 to 223 (inclusive)
start_idx = 217 
end_idx = 223

replacement = """                      <Accordion.Item eventKey={idx.toString()} key={section._id} className="mb-3 border rounded shadow-sm">
                           <Accordion.Header>
                               <div className="fw-bold w-100 d-flex justify-content-between align-items-center pe-3">
                                   <span>{section.title}</span>
                                   <div className="d-flex gap-2">
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        className={`p-0 text-muted ${idx === 0 ? 'opacity-25' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'up'); }}
                                        disabled={idx === 0}
                                      >
                                        <FiArrowUp />
                                      </Button>
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        className={`p-0 text-muted ${idx === course.sections.length - 1 ? 'opacity-25' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'down'); }}
                                        disabled={idx === course.sections.length - 1}
                                      >
                                        <FiArrowDown />
                                      </Button>
                                   </div>
                               </div>
                           </Accordion.Header>\n"""

# Verify the content before replacing
target_content = "".join(lines[start_idx:end_idx])
print("Targeting:")
print(target_content)

lines[start_idx:end_idx] = [replacement]

with open(file_path, 'w', encoding='utf8') as f:
    f.writelines(lines)

print("Replacement successful")

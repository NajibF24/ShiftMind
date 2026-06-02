from services.onedrive_service import get_access_token, list_files_recursive

token = get_access_token()
if token:
    files = list_files_recursive(token)
    print(f"Total files found: {len(files)}")
    hr_files = [f for f in files if "HR" in f["name"] or "hr" in f["name"].lower() or "overtime" in f["name"].lower()]
    print(f"HR/Overtime files: {len(hr_files)}")
    for f in hr_files:
        print(f"  - {f['name']} (parent: {f['parentPath']})")
    
    # Show all unique parent paths
    paths = set(f["parentPath"] for f in files)
    print(f"\nAll folder paths ({len(paths)}):")
    for p in sorted(paths):
        count = sum(1 for f in files if f["parentPath"] == p)
        print(f"  [{count} files] {p}")
else:
    print("Failed to get token")

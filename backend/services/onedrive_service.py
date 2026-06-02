"""
OneDrive Service — Microsoft Graph API client for accessing SOP/Policy documents.
Uses client_credentials OAuth2 flow via MSAL.
"""
import os
import io
import logging
from typing import Optional

import httpx
import msal

logger = logging.getLogger(__name__)

# Microsoft Graph config — read at call-time to avoid stale module-level cache
def _cfg(key: str, default: str = "") -> str:
    return os.getenv(key, default)

GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0"
SCOPES = ["https://graph.microsoft.com/.default"]

# Supported document extensions
SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".pptx", ".txt", ".md", ".doc"}


def _get_msal_app():
    """Create MSAL confidential client app."""
    authority = f"https://login.microsoftonline.com/{_cfg('MS_TENANT_ID')}"
    return msal.ConfidentialClientApplication(
        _cfg('MS_CLIENT_ID'),
        authority=authority,
        client_credential=_cfg('MS_CLIENT_SECRET'),
    )


def get_access_token() -> Optional[str]:
    """Acquire access token via client_credentials flow."""
    if not all([_cfg('MS_TENANT_ID'), _cfg('MS_CLIENT_ID'), _cfg('MS_CLIENT_SECRET')]):
        logger.warning("Microsoft Graph credentials not configured. Skipping OneDrive sync.")
        return None

    app = _get_msal_app()
    result = app.acquire_token_for_client(scopes=SCOPES)

    if "access_token" in result:
        return result["access_token"]
    else:
        error = result.get("error_description", result.get("error", "Unknown error"))
        logger.error(f"Failed to acquire MS Graph token: {error}")
        return None


def _get_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def list_files_recursive(token: str, folder_path: str = None) -> list[dict]:
    """
    List all files recursively in a OneDrive folder.
    Returns list of dicts with: id, name, size, lastModifiedDateTime, webUrl, mimeType
    """
    if folder_path is None:
        folder_path = _cfg('MS_ONEDRIVE_ROOT_FOLDER', 'GYS Procedures and Policy')

    # Encode folder path for URL
    encoded_path = folder_path.replace(" ", "%20")
    user_id = _cfg('MS_ONEDRIVE_USER_ID')
    url = f"{GRAPH_BASE_URL}/users/{user_id}/drive/root:/{encoded_path}:/children"

    all_files = []
    headers = _get_headers(token)

    try:
        with httpx.Client(timeout=30.0) as client:
            while url:
                response = client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()

                for item in data.get("value", []):
                    if "folder" in item:
                        # Recurse into subfolders
                        subfolder_path = f"{folder_path}/{item['name']}"
                        sub_files = list_files_recursive(token, subfolder_path)
                        all_files.extend(sub_files)
                    elif "file" in item:
                        ext = os.path.splitext(item["name"])[1].lower()
                        if ext in SUPPORTED_EXTENSIONS:
                            all_files.append({
                                "id": item["id"],
                                "name": item["name"],
                                "size": item.get("size", 0),
                                "lastModifiedDateTime": item.get("lastModifiedDateTime"),
                                "webUrl": item.get("webUrl", ""),
                                "mimeType": item.get("file", {}).get("mimeType", ""),
                                "parentPath": folder_path,
                            })

                # Handle pagination
                url = data.get("@odata.nextLink")

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error listing files in '{folder_path}': {e.response.status_code} - {e.response.text}")
    except Exception as e:
        logger.error(f"Error listing files in '{folder_path}': {e}")

    return all_files


def download_file(token: str, file_id: str) -> Optional[bytes]:
    """Download file content by file ID."""
    user_id = _cfg('MS_ONEDRIVE_USER_ID')
    url = f"{GRAPH_BASE_URL}/users/{user_id}/drive/items/{file_id}/content"
    headers = _get_headers(token)

    try:
        with httpx.Client(timeout=120.0, follow_redirects=True) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            return response.content
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error downloading file {file_id}: {e.response.status_code}")
        return None
    except Exception as e:
        logger.error(f"Error downloading file {file_id}: {e}")
        return None


def is_configured() -> bool:
    """Check if Microsoft Graph credentials are configured."""
    return all([
        _cfg('MS_TENANT_ID'),
        _cfg('MS_CLIENT_ID'),
        _cfg('MS_CLIENT_SECRET'),
        _cfg('MS_ONEDRIVE_USER_ID'),
    ])

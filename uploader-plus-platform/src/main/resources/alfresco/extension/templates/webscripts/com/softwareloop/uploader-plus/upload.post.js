<import resource="classpath:/alfresco/templates/webscripts/org/alfresco/repository/upload/upload.post.js">
// The above import allows us to reuse Alfresco original upload web script.
// When end user overrides via extension directory, this won't pick up the override.
// This is a drawback of Alfresco JS importing.


function uploaderPlusMain()
{
    var repoFormData, fnFieldValue, idx, max, field, fieldName, value;
    
    repoFormData = new Packages.org.alfresco.repo.forms.FormData();
    if(logger.isLoggingEnabled()) {
		logger.log("[Uploader plus] - uploaderPlusMain started...");
	}
    try {
        
        // Prevents Flash- and IE8-sourced "null" values being set for those parameters where they are invalid.
        // Note: DON'T use a "!==" comparison for "null" here.
        fnFieldValue = function (p_field) {
            return p_field.value.length() > 0 && p_field.value != "null" ? p_field.value : null;
        };

        // Parse file attributes
        for (idx = 0, max = formdata.fields.length; idx < max; idx++)
        {
            field = formdata.fields[idx];
            fieldName = String(field.name);
            
            switch (fieldName.toLowerCase())
            {
                case "filename":
                case "filedata":
                case "siteid":
                case "containerid":
                case "destination":
                case "uploaddirectory":
                case "createdirectory":
                case "updatenoderef":
                case "description":
                case "contenttype":
                case "aspects":
                case "majorversion":
                case "overwrite":
                case "thumbnails":
                case "updatenameandmimetype":
                    // ignore all special upload fields
                    break;
                case "alf_redirect":
                case "alf_destination":
                    // ignore all special form fields
                    break;
                default:
                    // any other field may be a form field (assoc_ or prop_ or any transient field)
                    value = fnFieldValue(field);
					if(logger.isLoggingEnabled()) {
						logger.log("[Uploader plus] - field: "+field+" | value: "+value);
					}
                    if (value !== null)
                    {
                        repoFormData.addFieldData(fieldName, value);
                    }
            }
        }
		if(logger.isLoggingEnabled()) {
			logger.log("[Uploader plus] - Saving form, repoFormData: "+repoFormData);
		}
        formService.saveForm("node", model.document.nodeRef, repoFormData);
    }
    catch (e) {
		if(logger.isLoggingEnabled()) {
			logger.log("[Uploader plus] - Error occurred while uploading due to : "+e.message);
		}
        // capture exception, annotate it accordingly and re-throw
        if (e.message && e.message.indexOf("AccessDeniedException") != -1) {
            e.code = 403;
        }
        else if (e.message && e.message.indexOf("FormNotFoundException") != -1) {
            // very unlikely
            e.code = 404;
        }
	    else if (e.message && e.message.indexOf("FileExistsException") != -1) {
            //Rename and upload.
			var fieldDataName = repoFormData.getFieldData("name");
			var dotIndex = fieldDataName.lastIndexOf(".");
			var tmpFilename = "";
			  if (dotIndex > 0)
		      {
		         // Filename contained ".", create "filename-1.txt"
		         tmpFilename = fieldDataName.substring(0, dotIndex) + "-" + "1" + fieldDataName.substring(dotIndex);
		      }
		      else
		      {
		         // Filename didn't contain a dot at all, create "filename-1"
		         tmpFilename = fieldDataName + "-" + "1";
		      }
			//Add updated name
			repoFormData.addFieldData("name", tmpFilename, true);
	        formService.saveForm("node", model.document.nodeRef, repoFormData);

        }
        else {
            e.code = 500;
            e.message = "Unexpected error occurred during upload of new content in uploader plus.";
        }
        throw e;
    }
}

// if upload.post.js main() failed with an exception, this won't be reached
// but there may be failures when only status is set
if (status.code == 200)
{
    uploaderPlusMain();
}

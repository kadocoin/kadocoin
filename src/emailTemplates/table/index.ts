export function tableRow(content: string): string {
  return `<tr style="border-collapse:collapse">
              <td align="left"
                style="Margin:0;padding-top:10px;padding-bottom:15px;padding-left:20px;padding-right:20px">
                <p
                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;font-size:16px">
                  ${content}                           
                </p>
              </td>
          </tr>`;
}

export function tableRowAlwaysHappy(): string {
  return `<tr style="border-collapse:collapse">
              <td align="left"
                style="Margin:0;padding-top:10px;padding-bottom:15px;padding-left:20px;padding-right:20px">
                <p
                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;font-size:16px">
                  If you have any questions, just reply to this email — we're always happy to help out. 
                </p>
              </td>
          </tr>`;
}

export function tableRowCheers(): string {
  return `<tr style="border-collapse:collapse">
              <td align="left"
                style="Margin:0;padding-top:10px;padding-bottom:15px;padding-left:20px;padding-right:20px">
                <p
                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;line-height:24px;font-size:16px">
                  Cheers, <br /> 
                  Kadocoin
                </p>
              </td>
          </tr>`;
}

export function tableRowHeadline(content: string): string {
  return `<tr style="border-collapse:collapse">
              <td align="center"
                style="Margin:0;padding-bottom:5px;padding-left:20px;padding-right:20px;padding-top:25px">
                <h2
                    style="Margin:0;line-height:34px;mso-line-height-rule:exactly;font-family:'open sans', 'helvetica neue', helvetica, arial, sans-serif;font-size:28px;font-style:normal;font-weight:bold;color:#444444">
                    ${content}
                </h2>
              </td>
          </tr>`;
}

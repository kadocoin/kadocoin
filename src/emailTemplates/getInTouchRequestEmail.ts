import emailFooter from './emailFooter';
import emailHeader from './emailHeader';
import { tableRow, tableRowCheers, tableRowHeadline } from './table';

export function GetInTouchRequestEmail(email: string): string {
  return ` ${emailHeader()}
    <table class="es-content" cellspacing="0" cellpadding="0" align="center"
         style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
         <tr style="border-collapse:collapse">
            <td align="center" style="padding:0;Margin:0">
               <table class="es-content-body"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:640px"
                  cellspacing="0" cellpadding="0" align="center">
                  <tr style="border-collapse:collapse">
                     <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px">
                        <table width="100%" cellspacing="0" cellpadding="0"
                           style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                           <tr style="border-collapse:collapse">
                              <td valign="top" align="center" style="padding:0;Margin:0;width:600px">
                                 <table
                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-radius:3px;background-color:#FFFFFF"
                                    width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" role="presentation">
                                    ${tableRowHeadline(' We Received Your Interest')}
                                    ${tableRow('We will get back to you as soon as possible.')}
                                    ${tableRow(
                                      'Thank you for the interest and look forward to serving your software needs.'
                                    )}
                                    ${tableRowCheers()}
                                 </table>
                              </td>
                           </tr>
                        </table>
                     </td>
                  </tr>
               </table>
            </td>
         </tr>
      </table>
       ${emailFooter(email)}`;
}

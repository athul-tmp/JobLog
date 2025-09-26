namespace backend.DTOs

{
  public record JobStatusHistoryDto(
       int Id,
       string Status,
       DateTime ChangeDate
   );
}